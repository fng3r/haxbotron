/** Array with a maximum length shifting items when full. */
export default class CircularArray<T> {
    public capacity: number;

    private array: Array<T>;

    constructor (capacity: number) {
        this.checkCapacity(capacity);
        this.capacity = capacity;
        this.array = [];
    }

    public push(item: T): void {
        this.array.push(item);
        if (this.array.length > this.capacity) {
            this.array.splice(0, this.array.length - this.capacity);
        }
    }

    public items(): T[] {
        return this.array.slice();
    }

    public getLastNItems(count: number) {
        return this.array.slice(-count);
    }

    public clear(): void {
        this.array.splice(0);
    }

    public isEmpty(): boolean {
        return this.array.length === 0;
    }

    public isFull(): boolean {
        return this.array.length === this.capacity;
    }

    private checkCapacity (size: number) {
        if (size < 0) {
            throw new RangeError('Invalid circular array size')
        }
    }
}