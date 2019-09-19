module.exports = {
  title: '效率平台技术栈',
  description: '效率平台技术栈文档',
  themeConfig:{
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: '用例平台', link: 'http://platform.qadev.corp.qihoo.net:1080/static/myIndex.html' },
      {text:'更多平台',
       items:[
            {text:'用例后台',link:'http://10.16.16.28:7080/'},
            {text:'qbuild',link:'https://qbuild.corp.qihoo.net/compile/index.php/Index/index'}
        ]
      }
    ],
    sidebar: {
		'/':[
				{
				  title:'高并发',
				  sidebarDepth: 3,
				  collapsable: false,
				  children:[
					'/qps/asynciobase',
					'/qps/go',
					'/qps/pythoncorbase',
				  ]
				},
				{
					title:'文档管理',
					sidebarDepth: 2,
					collapsable: false,
					children:[
						'/doc/gitbook',
						'/doc/markdown',
						'/doc/sitebuild',
					]
				}
		]
    }
  },
  plugins:[
		[
		'@vuepress/search', {
			searchMaxSuggestions: 10
		}],
		['@vuepress/back-to-top',true],
		['@vuepress/last-updated']
	],
  markdown: {
    lineNumbers: true,
    toc: { includeLevel: [1, 2] },
  }
}

