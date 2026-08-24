import * as harper from 'harper.js';
import { binary } from 'harper.js/binary';
import { parentPort, workerData } from 'node:worker_threads';

const linter = new harper.LocalLinter({
  binary,
  dialect: harper.Dialect.American,
});

try {
  const findings = [];

  for (const chunk of workerData.chunks) {
    for (const lint of await linter.lint(chunk.text)) {
      const span = lint.span();
      findings.push({
        chunkIndex: chunk.index,
        kind: lint.lint_kind(),
        message: lint.message(),
        span: { start: span.start, end: span.end },
        suggestions: lint.suggestions().map((suggestion) => suggestion.get_replacement_text()),
      });
    }
  }

  parentPort.postMessage({ findings });
} catch (error) {
  parentPort.postMessage({ error: error instanceof Error ? error.stack : String(error) });
} finally {
  await linter.dispose();
}
