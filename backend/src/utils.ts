export function replaceLastSegment(url, newSegment) {
  // Split the URL by '/'
  const parts = url.split("/");

  // Replace the last segment with the new one
  parts[parts.length - 1] = newSegment;

  // Join the parts back to form the modified URL
  const modifiedUrl = parts.join("/");

  return modifiedUrl;
}
