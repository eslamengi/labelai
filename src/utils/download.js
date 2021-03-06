/**
 * @param {string} dataurl
 * @param {string} filename
 * @example download("data:text/html,HelloWorld!", "helloWorld.txt");
 */
export default function download(dataurl, filename) {
  const a = document.createElement('a')
  a.href = dataurl
  a.setAttribute('download', filename)
  a.click()
  a.remove()
}
