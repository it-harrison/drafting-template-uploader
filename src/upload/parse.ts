import fs from 'node:fs';
import { parse } from 'csv-parse';

type ParseResult = {
  parseOk: boolean
  tickets?: string[][]
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
    result.parseOk = false
  }
  return result;
}
