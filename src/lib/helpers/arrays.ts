type KeyGetter<T> = (item: T) => string;
type ValueGetter<T, U> = (item: T) => U;
interface IGroup<T> { readonly [key: string]: ReadonlyArray<T>; }

export function groupByAndMap<T, U>(
    items: ReadonlyArray<T>,
    getKey: KeyGetter<T>,
    getValue: ValueGetter<T, U>,
  ): IGroup<U> {
  return items.reduce<IGroup<U>>((acc, item) => {
    const key = getKey(item);
    const value = acc[key] || [];
    return {...acc, [key]: [...value, getValue(item)]};
  }, {});
}
