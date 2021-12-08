import './index.scss'
import { Page } from "../../libs/page"
import { Tab } from '../../components/tab'
import { MusicUploadManagePage } from './upload'
import { MusicKindManagePage } from './kind'
import { MusicArtistManagePage } from './artist'
import { MusicAlbumManagePage } from './album'
import { MusicMusicManagePage } from './music'
import { FontManagePage } from './font'


interface IManagePageState {
	currentTab: string
}

export class ManagePage extends Page<{}, IManagePageState> {
	//tab切换
	private switchTab(to: string) {
		if (to == this.state?.currentTab) return
		this.setState({ currentTab: to })
	}

	render() {
		const { currentTab = 'music' } = this.state ?? {}
		return (
			<div id="manage-music-page">
				{/* 标题 */}
				< div className="page-title" > 乐库管理</div>
				{/* TAB */}
				< Tab style={{ marginTop: 20, marginBottom: 10 }} items={
					[
						{ key: 'music', title: '音乐' },
						{ key: 'album', title: '专辑' },
						{ key: 'artist', title: '歌手' },
						{ key: 'kind', title: '分类' },
						{ key: 'user', title: '用户' },
						{ key: 'font', title: '字体' },
						{ key: 'upload', title: '上传' },
					]} current={currentTab} onChange={this.switchTab.bind(this)} />
				{/* 上传管理 */}
				{currentTab == 'upload' ? <MusicUploadManagePage /> : null}
				{currentTab == 'kind' ? <MusicKindManagePage /> : null}
				{currentTab == 'artist' ? <MusicArtistManagePage /> : null}
				{currentTab == 'album' ? <MusicAlbumManagePage /> : null}
				{currentTab == 'music' ? <MusicMusicManagePage /> : null}
				{currentTab == 'font' ? <FontManagePage /> : null}
			</div >
		)
	}
}