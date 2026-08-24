const FIRST_EXECUTIVE_DECISION_WAVE = 93;
const EXECUTIVE_APPROVAL_PATTERN =
  /^MRX_CEO_DECISION:\s+(?:APPROVE_REDEFINED|SELECT_ONE)\b.*$/m;

export function assertExecutiveSelectionDecision({ waveNumber, decisionSource }) {
  const numericWave = Number(waveNumber);
  if (!Number.isInteger(numericWave)) {
    throw new Error(`Invalid MRX wave number: ${waveNumber}`);
  }
  if (numericWave < FIRST_EXECUTIVE_DECISION_WAVE) return;

  if (decisionSource.includes('CODEX_SELECTION:')) {
    throw new Error(
      `Wave ${numericWave} cannot be admitted from a CODEX_SELECTION decision; a read-only Chesty/mrx_ceo verdict is required`,
    );
  }
  if (!EXECUTIVE_APPROVAL_PATTERN.test(decisionSource)) {
    throw new Error(
      `Wave ${numericWave} selection decision lacks an admissible MRX_CEO_DECISION verdict`,
    );
  }
}
