import fs from 'node:fs';
import { parse } from 'csv-parse';

type ParseResult = {
  parseOk: boolean
  tickets?: string[][]
  error?: string | null
}
export async function parseFile(filepath: string): Promise<ParseResult> {
  const result: ParseResult = {
    parseOk: true,
    tickets: []
  }
  const parser = fs
    .createReadStream(filepath)
    .pipe(parse({}));
  
  try {
    for await (const ticket of parser) {
      result.tickets.push(ticket);
    }
  } catch (error) {
    result.error = error.toString();
    result.parseOk = false
  }
  return result;
}
