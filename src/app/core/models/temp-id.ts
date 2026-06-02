let counter = 0;

export function tempId(): number {
  counter -= 1;
  return counter;
}

export function isTempId(id: number): boolean {
  return id < 0;
}
