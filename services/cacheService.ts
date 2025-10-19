// services/cacheService.ts

const CACHE_PREFIX = 'gemini-cache-';

/**
 * Creates a unique cache key based on the function name and its inputs.
 * @param functionName - The name of the function being called.
 * @param inputs - An object containing the input parameters for the function.
 * @returns A unique string key for the cache.
 */
const createKey = (functionName: string, inputs: object): string => {
  try {
    const sortedInputs = Object.keys(inputs).sort().reduce(
      (obj, key) => { 
        obj[key] = inputs[key]; 
        return obj;
      }, 
      {}
    );
    const inputString = JSON.stringify(sortedInputs);
    return `${CACHE_PREFIX}${functionName}-${inputString}`;
  } catch (error) {
    console.error("Error creating cache key:", error);
    // Fallback to a simple key if stringification fails
    return `${CACHE_PREFIX}${functionName}-${Date.now()}`;
  }
};

/**
 * Retrieves and parses a value from the localStorage cache.
 * @param key - The cache key.
 * @returns The cached value, or null if not found or if parsing fails.
 */
export const getFromCache = <T>(functionName: string, inputs: object): T | null => {
  const key = createKey(functionName, inputs);
  try {
    const cachedItem = localStorage.getItem(key);
    if (cachedItem) {
      console.log(`Cache HIT for ${functionName}`);
      return JSON.parse(cachedItem) as T;
    }
    console.log(`Cache MISS for ${functionName}`);
    return null;
  } catch (error) {
    console.error("Error retrieving from cache:", error);
    return null;
  }
};

/**
 * Stores a value in the localStorage cache.
 * @param key - The cache key.
 * @param value - The value to store.
 */
export const setInCache = <T>(functionName: string, inputs: object, value: T): void => {
  const key = createKey(functionName, inputs);
  try {
    const stringifiedValue = JSON.stringify(value);
    localStorage.setItem(key, stringifiedValue);
  } catch (error) {
    console.error("Error setting cache:", error);
    // Potentially handle quota exceeded errors here, e.g., by clearing old cache entries.
  }
};
