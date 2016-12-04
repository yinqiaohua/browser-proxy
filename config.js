module.exports = {
  pac: '/Users/zhangheng/test/proxy.pac',
  rules: [
  	// {
  	//   regx: 'https?://v.qq.com/',
  	//   localFile: '/Users/zhangheng/sh/test.js'
  	// }
  	{
  	  regx: '^https?://vm.gtimg.cn/',
  	  host: '183.56.150.146'
  	}
  ],
  disable_cache: true,
  disable_gzip: true
}