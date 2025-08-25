/**
 * Универсальная функция для глубокого сравнения объектов
 * Поддерживает примитивы, массивы, объекты и null/undefined
 */

export function deepEqual(a: unknown, b: unknown): boolean {
  // Сравнение примитивов
  if (a === b) {
    return true;
  }

  // Обработка null и undefined
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  // Проверка типов
  if (typeof a !== typeof b) {
    return false;
  }

  // Сравнение массивов
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // Сравнение объектов
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }
      if (
        !deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        )
      ) {
        return false;
      }
    }
    return true;
  }

  // Для остальных случаев (функции, символы и т.д.)
  return false;
}

/**
 * Типизированная версия deepEqual для массивов
 */
export function deepEqualArray<T>(a: T[], b: T[]): boolean {
  return deepEqual(a, b);
}

/**
 * Типизированная версия deepEqual для объектов
 */
export function deepEqualObject<T extends Record<string, unknown>>(
  a: T,
  b: T,
): boolean {
  return deepEqual(a, b);
}
