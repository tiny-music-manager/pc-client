import { i18ndef } from "./base";

export const home = {
	left: {
		title: i18ndef('zh', '音乐管理器').add('en', 'Music Manager'),
		musiclist: i18ndef('zh', '音乐列表').add('en', 'Music List'),
		recommend: i18ndef('zh', '每日推荐').add('en', 'Recommend'),
		artist: i18ndef('zh', '歌手').add('en', 'Artist'),
		kind: i18ndef('zh', '分类').add('en', 'Kind'),
		album: i18ndef('zh', '专辑').add('en', 'Album'),
		mine: i18ndef('zh', '我的音乐').add('en', 'My Music'),
		love: i18ndef('zh', '我喜欢').add('en', 'Love'),
	},
	title: {
		searchPlaceholder: i18ndef('zh', '搜索音乐').add('en', 'Search music'),
		menu: {
			setting: i18ndef('zh', '设置').add('en', 'Settings'),
			control: i18ndef('zh', '管理中心').add('en', 'Control Center'),
			about: i18ndef('zh', '关于').add('en', 'About'),
			help: i18ndef('zh', '帮助').add('en', 'Help'),
			exit: i18ndef('zh', '退出').add('en', 'Quit'),
		}
	}
}