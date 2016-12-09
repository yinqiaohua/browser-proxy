module.exports = {
  rules: [
    // 代理到本地文件
    {
      regx: '^https?://v.qq.com/welcome.html',
      localFile: './welcome.html',
    }
  ],
  disable_cache: true,
  disable_gzip: true
}