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

/**
 * The model chooses the file paths, so they are untrusted input. A path like "../x" or an
 * absolute path must never be written outside the target project folder.
 */
function resolveInsideProject(targetDir: string, relativePath: unknown): string {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new Error("A file entry from the model had no usable path, so no files were changed.");
  }
  const root = path.resolve(targetDir);
  const absPath = path.resolve(root, relativePath);
  const relative = path.relative(root, absPath);
  const escapes =
    path.isAbsolute(relativePath) ||
    relative === "" ||
    relative === ".." ||
    relative.startsWith(".." + path.sep) ||
    path.isAbsolute(relative);
  if (escapes) {
    throw new Error(
      `Refusing to write "${relativePath}": the path is outside the project folder, so no files were changed.`
    );
  }
  return absPath;
}

export async function applyFileEdits(
  targetDir: string,
  modelText: string
): Promise<{ summary: string; filesWritten: string[] }> {
  const { summary, files } = parseEditPayload(modelText);

  // Check every path BEFORE writing anything, so one unsafe path can't leave a half-applied change.
  const resolved = files.map((file) => ({ file, absPath: resolveInsideProject(targetDir, file.path) }));

  const filesWritten: string[] = [];
  for (const { file, absPath } of resolved) {
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, file.content, "utf-8");
    filesWritten.push(file.path);
  }

  return { summary, filesWritten };
}
