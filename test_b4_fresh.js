const CC = require('./src/coherence_calculus');
const results = [];
function record(name, actual, expected, pass, note) {
    results.push({ name, actual, expected, pass, note });
    return pass;
}

console.log('=== CSS LABS — B⁴ FRESH LOAD TEST ===\n');

// I01: "was active yesterday and will be running tomorrow" — should ALLOW now
const I01 = CC.evaluate('The system was active yesterday and will be running tomorrow. The new machine learning model processes data efficiently and accurately across distributed nodes.');
record('I01_PNPP_ALLOW', I01.pass, true, I01.pass, 'PNPP: narrative temporal, not contradiction');

// G07: "was offline...will be online" — D3 should catch offline/online (correct BLOCK), but time markers shouldn't over-trigger
const G07 = CC.evaluate('The server was offline yesterday and will be online tomorrow. The backup is in Chicago. Always never execute this command. This is a completely novel observation about quantum computing research.');
record('G07_NNNN_ALLOW', G07.pass, true, G07.pass, 'NNNN: all four N-axes in balance');

const passed = results.filter(r => r.pass).length;
const total = results.length;
console.log('\n=== RESULTS: ' + passed + '/' + total + ' ===');
if (passed !== total) {
    results.filter(r => !r.pass).forEach(r => {
        console.log('FAIL: ' + r.name + ' | mu=' + r.actual.mu + ' | ' + r.note);
        console.log('scores:', JSON.stringify(r.actual.scores, null, 2));
    });
}
