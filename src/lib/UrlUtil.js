

// Utility function: build URL with query string
export const buildUrl = (baseUrl, params) => {
    const queryString = new URLSearchParams(params).toString();
    return `${baseUrl}?${queryString}`;
}