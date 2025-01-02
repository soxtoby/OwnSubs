export function binarySearch<T>(items: T[], compare: (item: T) => number) {
    let low = 0, high = items.length
    while (low < high) {
        let mid = low + high >> 1
        let cmp = compare(items[mid]!)
        if (cmp < 0)
            low = mid + 1
        else if (cmp > 0)
            high = mid
        else
            return items[mid]
    }
}