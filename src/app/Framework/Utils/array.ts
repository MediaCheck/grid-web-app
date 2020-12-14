/**
 * 
 * Create union of two arrays
 * 
 */
export function union(a, b) {
    let r = a.slice(0);
    b.forEach(function(i) { 
        if (r.indexOf(i) < 0) r.push(i); 
    });
    return r;
}

/**
 * 
 * Create diff of two arrays
 * 
 */
export function diff(a, b) {
    return a.filter(function(i) {
        return b.indexOf(i) < 0;
    });
}