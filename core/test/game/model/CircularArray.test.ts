import CircularArray from '../../../game/model/CircularArray';

describe('CircularArray', () => {
  let circularArray: CircularArray<number>;

  beforeEach(() => {
    circularArray = new CircularArray<number>(3); // capacity of 3
  });

  it('should create a circular array with specified capacity', () => {
    expect(circularArray).toBeDefined();
    expect(circularArray.capacity).toBe(3);
  });

  it('should add items and retrieve them', () => {
    circularArray.push(1);
    circularArray.push(2);
    
    expect(circularArray.items()).toEqual([1, 2]);
  });

  it('should overwrite oldest items when capacity is exceeded', () => {
    circularArray.push(1);
    circularArray.push(2);
    circularArray.push(3);
    circularArray.push(4); // Should overwrite 1
    
    expect(circularArray.items()).toEqual([2, 3, 4]);
  });

  it('should check if empty', () => {
    expect(circularArray.isEmpty()).toBe(true);
    
    circularArray.push(1);
    expect(circularArray.isEmpty()).toBe(false);
  });

  it('should check if full', () => {
    expect(circularArray.isFull()).toBe(false);
    
    circularArray.push(1);
    circularArray.push(2);
    expect(circularArray.isFull()).toBe(false);
    
    circularArray.push(3);
    expect(circularArray.isFull()).toBe(true);
  });

  it('should handle capacity correctly', () => {
    circularArray.push(1);
    circularArray.push(2);
    circularArray.push(3);
    
    expect(circularArray.isFull()).toBe(true);
    
    circularArray.push(4);
    
    // Should still be full (capacity 3)
    expect(circularArray.isFull()).toBe(true);
    expect(circularArray.items()).toHaveLength(3);
  });

  it('should clear all items', () => {
    circularArray.push(1);
    circularArray.push(2);
    circularArray.clear();
    
    expect(circularArray.isEmpty()).toBe(true);
    expect(circularArray.items()).toEqual([]);
  });

  it('should get last N items', () => {
    circularArray.push(1);
    circularArray.push(2);
    circularArray.push(3);
    
    expect(circularArray.getLastNItems(2)).toEqual([2, 3]);
    expect(circularArray.getLastNItems(1)).toEqual([3]);
  });

  it('should throw error for negative capacity', () => {
    expect(() => new CircularArray<number>(-1)).toThrow(RangeError);
    expect(() => new CircularArray<number>(-1)).toThrow('Invalid circular array size');
  });
});
