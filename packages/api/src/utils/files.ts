import path from 'path';
import crypto from 'node:crypto';
import { createReadStream } from 'fs';
import { readFile, stat } from 'fs/promises';

/**
 * Sanitize a filename by removing any directory components, replacing non-alphanumeric characters
 * @param inputName
 */
export function sanitizeFilename(inputName: string): string {
  // Remove any directory components
  let name = path.basename(inputName);

  // Replace any non-alphanumeric characters except for '.' and '-'
  name = name.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Ensure the name doesn't start with a dot (hidden file in Unix-like systems)
  if (name.startsWith('.') || name === '') {
    name = '_' + name;
  }

  // Limit the length of the filename
  const MAX_LENGTH = 255;
  if (name.length > MAX_LENGTH) {
    const ext = path.extname(name);
    const nameWithoutExt = path.basename(name, ext);
    name =
      nameWithoutExt.slice(0, MAX_LENGTH - ext.length - 7) +
      '-' +
      crypto.randomBytes(3).toString('hex') +
      ext;
  }

  return name;
}

/**
 * Options for reading files
 */
export interface ReadFileOptions {
  encoding?: BufferEncoding;
  /** Size threshold in bytes. Files larger than this will be streamed. Default: 10MB */
  streamThreshold?: number;
  /** Size of chunks when streaming. Default: 64KB */
  highWaterMark?: number;
  /** File size in bytes if known (e.g. from multer). Avoids extra stat() call. */
  fileSize?: number;
  /** If true, will not throw error on large files even if they exceed memory limits (use with caution) */
  forceStream?: boolean;
}

/**
 * Result from reading a file
 */
export interface ReadFileResult<T> {
  content: T;
  bytes: number;
}

/**
 * Streams a file and applies a callback to each chunk.
 * Recommended for very large files to avoid memory issues.
 */
export async function streamFile(
  filePath: string,
  onChunk: (chunk: string | Buffer) => void | Promise<void>,
  options: ReadFileOptions = {},
): Promise<number> {
  const { encoding, highWaterMark = 64 * 1024, fileSize } = options;

  const bytes = fileSize ?? (await stat(filePath)).size;
  const stream = createReadStream(filePath, {
    encoding,
    highWaterMark,
  });

  for await (const chunk of stream) {
    await onChunk(chunk as string | Buffer);
  }

  return bytes;
}

/**
 * Reads a file asynchronously. Uses streaming for large files to avoid memory issues.
 *
 * @param filePath - Path to the file to read
 * @param options - Options for reading the file
 * @returns Promise resolving to the file contents and size
 * @throws Error if the file cannot be read
 */
export async function readFileAsString(
  filePath: string,
  options: ReadFileOptions = {},
): Promise<ReadFileResult<string>> {
  const {
    encoding = 'utf8',
    streamThreshold = 10 * 1024 * 1024, // 10MB
    highWaterMark = 64 * 1024, // 64KB
    fileSize,
    forceStream = false,
  } = options;

  // Get file size if not provided
  const bytes = fileSize ?? (await stat(filePath)).size;

  // For very large files (> 100MB), discourage using this function unless forced
  if (bytes > 100 * 1024 * 1024 && !forceStream) {
    throw new Error(
      `File size (${(bytes / (1024 * 1024)).toFixed(2)} MB) is too large for readFileAsString. Use streamFile instead.`,
    );
  }

  // For large files, use streaming to avoid memory issues
  if (bytes > streamThreshold) {
    const chunks: string[] = [];
    await streamFile(
      filePath,
      (chunk) => {
        chunks.push(chunk as string);
      },
      { encoding, highWaterMark, fileSize: bytes },
    );

    return { content: chunks.join(''), bytes };
  }

  // For smaller files, read directly
  const content = await readFile(filePath, encoding);
  return { content, bytes };
}

/**
 * Reads a file as a Buffer asynchronously. Uses streaming for large files.
 *
 * @param filePath - Path to the file to read
 * @param options - Options for reading the file
 * @returns Promise resolving to the file contents and size
 * @throws Error if the file cannot be read
 */
export async function readFileAsBuffer(
  filePath: string,
  options: Omit<ReadFileOptions, 'encoding'> = {},
): Promise<ReadFileResult<Buffer>> {
  const {
    streamThreshold = 10 * 1024 * 1024, // 10MB
    highWaterMark = 64 * 1024, // 64KB
    fileSize,
    forceStream = false,
  } = options;

  // Get file size if not provided
  const bytes = fileSize ?? (await stat(filePath)).size;

  // For very large files (> 100MB), discourage using this function unless forced
  if (bytes > 100 * 1024 * 1024 && !forceStream) {
    throw new Error(
      `File size (${(bytes / (1024 * 1024)).toFixed(2)} MB) is too large for readFileAsBuffer. Use streamFile instead.`,
    );
  }

  // For large files, use streaming to avoid memory issues
  if (bytes > streamThreshold) {
    const chunks: Buffer[] = [];
    await streamFile(
      filePath,
      (chunk) => {
        chunks.push(chunk as Buffer);
      },
      { highWaterMark, fileSize: bytes },
    );

    return { content: Buffer.concat(chunks), bytes };
  }

  // For smaller files, read directly
  const content = await readFile(filePath);
  return { content, bytes };
}

/**
 * Reads a JSON file asynchronously
 *
 * @param filePath - Path to the JSON file to read
 * @param options - Options for reading the file
 * @returns Promise resolving to the parsed JSON object
 * @throws Error if the file cannot be read or parsed
 */
export async function readJsonFile<T = unknown>(
  filePath: string,
  options: Omit<ReadFileOptions, 'encoding'> = {},
): Promise<T> {
  const { content } = await readFileAsString(filePath, { ...options, encoding: 'utf8' });
  return JSON.parse(content);
}
