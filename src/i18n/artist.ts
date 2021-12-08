import { i18ndef } from "./base";

export const artist = {
	title: i18ndef('zh', '歌手').add('en', 'Artist'),
	abcFilterAll: i18ndef('zh', '全部').add('en', 'ALL'),
	genderFilterAll: i18ndef('zh', '全部').add('en', 'ALL'),
	genderFilterMale: i18ndef('zh', '男').add('en', 'Male'),
	genderFilterFemale: i18ndef('zh', '女').add('en', 'Female'),
	detail: {
		playAll: i18ndef('zh', '全部播放').add('en', 'Play All'),
		collect: i18ndef('zh', '添加到收藏').add('en', 'Add To Collection'),
		uncollect: i18ndef('zh', '取消收藏').add('en', 'Remove From Collection'),
		musics: i18ndef('zh', '歌曲').add('en', 'Musics'),
		detail: i18ndef('zh', '歌手信息').add('en', 'Artist Details'),
		otherAlbums: i18ndef('zh', '其他专辑').add('en', 'Other Albums'),
		musicName: i18ndef('zh', '歌曲名称').add('en', 'Music Name'),
		albumName: i18ndef('zh', '专辑').add('en', 'Albums'),
		timeName: i18ndef('zh', '时长').add('en', 'Time'),
	}
}