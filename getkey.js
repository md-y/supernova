function getKey(s, k, d) {
    try {
        return s.match("[?]" + k + "=([^?|#]+)")[1];
    } catch (err) {
        console.log("Cannot find " + k + ", using " + d)
        return d;
    }
}