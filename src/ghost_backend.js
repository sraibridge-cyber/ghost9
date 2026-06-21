// =====================================================================
// GHOST BACKEND — Phase 1 Hardening
// CSS Labs | Kyle S. Whitlock | Seal: 2026-06-21_17:54_Tulsa_OK
// =====================================================================
// Atomic state writes, SHA3-512 crypto verification, Termux channel management
// Zero cloud, zero vendor lock-in, phone-first architecture
// =====================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const { createHash, randomBytes } = require('crypto');
const net = require('net');

const STATE_FILE = path.join(process.env.HOME || '.', 'ghost', 'state.json');
const TEMP_SUFFIX = '.tmp';
const BACKUP_SUFFIX = '.bak';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

// --- Atomic Write ---
function atomicWrite(filePath, data, callback) {
  const dir = path.dirname(filePath);
  const tempPath = filePath + TEMP_SUFFIX + randomBytes(4).toString('hex');
  const backupPath = filePath + BACKUP_SUFFIX;

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Step 1: Write to temp file
  fs.writeFile(tempPath, data, 'utf8', (err) => {
    if (err) return callback(err);

    // Step 2: Compute hash of temp file
    fs.readFile(tempPath, 'utf8', (err, tempData) => {
      if (err) return callback(err);

      const tempHash = sha3_512(tempData);
      const expectedHash = sha3_512(data);

      // Step 3: Verify hash matches (data integrity)
      if (tempHash !== expectedHash) {
        fs.unlink(tempPath, () => {});
        return callback(new Error('ATOMIC_WRITE_HASH_MISMATCH: temp file corrupted during write'));
      }

      // Step 4: Backup existing file (if exists)
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
          // File exists, create backup
          fs.copyFile(filePath, backupPath, (err) => {
            if (err) {
              fs.unlink(tempPath, () => {});
              return callback(err);
            }
            doRename();
          });
        } else {
          doRename();
        }
      });
    });
  });

  function doRename() {
    // Step 5: Atomic rename (POSIX guarantee)
    fs.rename(tempPath, filePath, (err) => {
      if (err) {
        // Rollback: restore backup
        fs.access(backupPath, fs.constants.F_OK, (err) => {
          if (!err) {
            fs.copyFile(backupPath, filePath, () => {});
          }
        });
        fs.unlink(tempPath, () => {});
        return callback(err);
      }

      // Step 6: Verify written file
      fs.readFile(filePath, 'utf8', (err, writtenData) => {
        if (err) {
          return callback(err); // Backup still exists for manual recovery
        }

        const writtenHash = sha3_512(writtenData);
        if (writtenHash !== expectedHash) {
          // Corruption detected after rename — this is extremely rare
          fs.copyFile(backupPath, filePath, () => {});
          return callback(new Error('ATOMIC_WRITE_POST_RENAME_CORRUPTION'));
        }

        // Success: clean up temp and backup
        fs.unlink(tempPath, () => {});
        fs.unlink(backupPath, () => {});
        callback(null, { hash: writtenHash, bytes: writtenData.length });
      });
    });
  }
}

// --- SHA3-512 Helper ---
function sha3_512(data) {
  return createHash('sha3-512').update(String(data)).digest('hex');
}

// --- State Manager with Atomic Writes ---
class GhostState {
  constructor(statePath = STATE_FILE) {
    this.statePath = statePath;
    this.state = {};
    this.lastHash = null;
    this.writeCount = 0;
    this.errorCount = 0;
    this.lastWriteTs = null;
  }

  load() {
    try {
      if (fs.existsSync(this.statePath)) {
        const data = fs.readFileSync(this.statePath, 'utf8');
        this.state = JSON.parse(data);
        this.lastHash = sha3_512(data);
        return { success: true, hash: this.lastHash };
      }
      return { success: true, hash: null, note: 'no_existing_state' };
    } catch (err) {
      // Try backup
      const backupPath = this.statePath + BACKUP_SUFFIX;
      if (fs.existsSync(backupPath)) {
        const data = fs.readFileSync(backupPath, 'utf8');
        this.state = JSON.parse(data);
        this.lastHash = sha3_512(data);
        return { success: true, hash: this.lastHash, recovered: true };
      }
      return { success: false, error: err.message };
    }
  }

  save(callback) {
    const data = JSON.stringify(this.state, null, 2);
    const expectedHash = sha3_512(data);

    atomicWrite(this.statePath, data, (err, result) => {
      if (err) {
        this.errorCount++;
        return callback(err);
      }

      this.writeCount++;
      this.lastWriteTs = Date.now();
      this.lastHash = result.hash;
      callback(null, { hash: result.hash, bytes: result.bytes, writes: this.writeCount });
    });
  }

  syncSave() {
    const data = JSON.stringify(this.state, null, 2);
    const dir = path.dirname(this.statePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempPath = this.statePath + TEMP_SUFFIX + randomBytes(4).toString('hex');
    const backupPath = this.statePath + BACKUP_SUFFIX;

    // Write temp
    fs.writeFileSync(tempPath, data, 'utf8');

    // Verify
    const tempData = fs.readFileSync(tempPath, 'utf8');
    if (sha3_512(tempData) !== sha3_512(data)) {
      fs.unlinkSync(tempPath);
      throw new Error('ATOMIC_WRITE_HASH_MISMATCH');
    }

    // Backup existing
    if (fs.existsSync(this.statePath)) {
      fs.copyFileSync(this.statePath, backupPath);
    }

    // Atomic rename
    fs.renameSync(tempPath, this.statePath);

    // Verify
    const writtenData = fs.readFileSync(this.statePath, 'utf8');
    const writtenHash = sha3_512(writtenData);
    if (writtenHash !== sha3_512(data)) {
      fs.copyFileSync(backupPath, this.statePath);
      throw new Error('ATOMIC_WRITE_POST_RENAME_CORRUPTION');
    }

    // Cleanup
    try { fs.unlinkSync(tempPath); } catch(e) {}
    try { fs.unlinkSync(backupPath); } catch(e) {}

    this.writeCount++;
    this.lastWriteTs = Date.now();
    this.lastHash = writtenHash;

    return { hash: writtenHash, bytes: writtenData.length, writes: this.writeCount };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
  }

  stats() {
    return {
      path: this.statePath,
      keys: Object.keys(this.state).length,
      writeCount: this.writeCount,
      errorCount: this.errorCount,
      lastWriteTs: this.lastWriteTs,
      lastHash: this.lastHash
    };
  }
}

// --- Termux Channel Manager ---
class GhostChannel {
  constructor(port, name = 'ghost') {
    this.port = port;
    this.name = name;
    this.server = null;
    this.clients = new Map();
    this.messageLog = [];
    this.started = false;
  }

  start(handler) {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        const clientId = randomBytes(8).toString('hex');
        this.clients.set(clientId, socket);

        socket.on('data', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            this.messageLog.push({ ts: Date.now(), clientId, msg });
            handler(msg, (response) => {
              socket.write(JSON.stringify(response) + '\n');
            });
          } catch (err) {
            socket.write(JSON.stringify({ error: err.message }) + '\n');
          }
        });

        socket.on('close', () => {
          this.clients.delete(clientId);
        });
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        this.started = true;
        resolve({ port: this.port, status: 'listening' });
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      for (const [id, socket] of this.clients) {
        socket.end();
      }
      if (this.server) {
        this.server.close(() => {
          this.started = false;
          resolve({ status: 'closed' });
        });
      } else {
        resolve({ status: 'not_started' });
      }
    });
  }

  broadcast(msg) {
    const data = JSON.stringify(msg) + '\n';
    for (const [id, socket] of this.clients) {
      socket.write(data);
    }
    return this.clients.size;
  }

  stats() {
    return {
      name: this.name,
      port: this.port,
      started: this.started,
      clients: this.clients.size,
      messages: this.messageLog.length
    };
  }
}

// --- Crash Recovery ---
function crashRecovery(statePath = STATE_FILE) {
  const results = {
    stateFile: false,
    backupFile: false,
    recovered: false,
    state: null
  };

  try {
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf8');
      JSON.parse(data); // Validate
      results.stateFile = true;
      results.state = JSON.parse(data);
    }
  } catch (err) {
    results.stateFile = false;
  }

  const backupPath = statePath + BACKUP_SUFFIX;
  try {
    if (fs.existsSync(backupPath)) {
      const data = fs.readFileSync(backupPath, 'utf8');
      JSON.parse(data);
      results.backupFile = true;
      if (!results.state) {
        results.state = JSON.parse(data);
        results.recovered = true;
      }
    }
  } catch (err) {
    results.backupFile = false;
  }

  return results;
}

module.exports = {
  GhostState,
  GhostChannel,
  atomicWrite,
  sha3_512,
  crashRecovery,
  STATE_FILE
};
