const clients = new Map();

export function addClient(id: symbol, controller: ReadableStreamDefaultController): void {
	clients.set(id, controller);
}
export function removeClient(id: symbol): void {
	clients.delete(id);
}
export function getClientIterator() {
	return clients[Symbol.iterator]();
}

export function sendAll(data: string) {
	const message = data
		.split('\n')
		.map((_) => `data: ${_}`)
		.join('\n');
	for (const [, controller] of getClientIterator()) {
		controller.enqueue(`${message}\n\n`);
	}
}
