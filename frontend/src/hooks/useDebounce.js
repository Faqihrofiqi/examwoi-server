// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Atur timeout untuk update nilai setelah delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Bersihkan timeout jika nilai atau delay berubah
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;