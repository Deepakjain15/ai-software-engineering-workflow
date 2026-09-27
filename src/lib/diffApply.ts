import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface FileEdit {
  path: string;
  content: string;
}

interface EditPayload {
  summary: string;
  files: FileEdit[];
}

/**
 * The model is prompted to respond with JSON: { summary, files: [{ path, content }] }.
 * This is a deliberately simpler contract than a real unified diff — for an MVP,
 * "the model returns full file contents" is far more reliable to parse and apply
 * than getting an LLM to produce a byte-perfect patch.
 */
function parseEditPayload(modelText: string): EditPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(modelText);
  } catch (error) {
    throw new Error(
      `Model response wasn't valid JSON, so no files were changed.\n${(error as Error).message}\n\nRaw response:\n${modelText}`
    );
  }

  const payload = parsed as Partial<EditPayload>;
  if (!Array.isArray(payload.files)) {
    throw new Error('Model response was missing a "files" array.');
  }
  return { summary: payload.summary ?? "(no summary provided)", files: payload.files };
}

export async function applyFileEdits(
  targetDir: string,
  modelText: string
): Promise<{ summary: string; filesWritten: string[] }> {
  const { summary, files } = parseEditPayload(modelText);

  const filesWritten: string[] = [];
  for (const file of files) {
    const absPath = path.join(targetDir, file.path);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, file.content, "utf-8");
    filesWritten.push(file.path);
  }

  return { summary, filesWritten };
}
