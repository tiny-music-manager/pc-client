import './artist.scss'
import { Page } from "../../libs/page"
import { apis } from '../../api'
import { IArtist } from '../../libs/datatype'
import { Image } from '../../components/image/image'
import { CheckBox } from '../../components/checkbox'
import { createDialog } from '../../components/popover'
import { ArtistEditor } from '../editor/artist/editor'
import { TMMComponent } from '../../libs/component'


interface IMusicArtistManagePageState {
	keyword: string
	artists: Array<IArtist>
	checked: string
	searching: boolean
}

export class MusicArtistManagePage extends TMMComponent<any, IMusicArtistManagePageState> {
	private static oldState: IMusicArtistManagePageState

	constructor(props: any) {
		super(props)
		this.state = MusicArtistManagePage.oldState ?? { artists: [], keyword: '', checked: '', searching: false }
	}

	componentWillUnmount() {
		MusicArtistManagePage.oldState = { ...this.state, searching: false }
	}

	private async handleSearch() {
		if (this.state.searching) return
		const kw = this.state?.keyword?.trim()
		if (!kw) return
		this.setState({ artists: [], checked: '', searching: true })
		const artists = await apis.artist.search(({ keyword: kw }))
		this.setState({ artists, searching: false })
	}

	private get current(): IArtist | null {
		const { artists = [], checked = '' } = this.state ?? {}
		return artists.filter(a => a.id == checked)?.[0] ?? null
	}

	private async handleSaveArtist(type: 'edit' | 'add') {
		const artist = this.current
		if (type == 'edit' && !artist) return

		const result = await ArtistEditor.open({
			info: {
				id: artist?.id,
				name: artist?.name ?? '', fname: artist?.fname ?? '',
				birthday: artist?.birthday ?? '', desc: artist?.desc ?? '',
				avatar: artist?.avatar ?? '', avatarFile: undefined
			}
		})
		if (!result) return

		if (type == 'edit') {
			const { avatar } = await apis.artist.save({
				id: artist?.id, name: result.name, fname: result.fname || undefined, birthday: result.birthday || undefined, desc: result.desc || undefined
			}, {
				avatar: result.avatarFile?.path
			})
			artist!.name = result.name
			artist!.fname = result.fname
			artist!.birthday = result.birthday
			artist!.desc = result.desc
			artist!.avatar = avatar ?? artist?.avatar
		}
		this.forceUpdate()
	}

	private async handleRemoveArtist() {
		const artist = this.current
		if (!artist) return

		if (!await createDialog('????????????', `??????????????????????????????????????????????????????????????????????????????????????????????????????`).wait()) return
		await apis.artist.remove({ id: artist.id })

		this.setState({ artists: this.state.artists.filter(a => a.id != artist.id) })
	}


	render() {
		const { keyword = '', artists = [], checked = '', searching } = this.state ?? {}
		return (
			<div className="manage-artist">
				<div className="title-bar">
					<div className="search-bar">
						<form onSubmit={e => e.preventDefault() as any || (keyword.trim() && this.handleSearch())}>
							<input type="text" className="input" placeholder="???????????????" value={keyword} onChange={e => this.setState({ keyword: e.target.value })} />
						</form>
						<div className={`button ${keyword.trim() ? '' : 'disabled'}`} onClick={() => this.handleSearch()}>??????</div>
						<div className={`button ${checked ? '' : 'disabled'}`} onClick={() => this.handleSaveArtist('edit')}>????????????</div>
						<div className={`button ${checked ? '' : 'disabled'}`} onClick={() => this.handleRemoveArtist()}>????????????</div>
					</div>
				</div>
				<div className="body">
					<div className="singer-line head">
						<div className="check"></div>
						<div className="avatar"></div>
						<div className="name">??????</div>
						<div className="fname">?????????</div>
						<div className="counts">?????????</div>
						<div className="counts">?????????</div>
						<div className="birthday">??????</div>
						<div className="desc">??????</div>
					</div>
					<div className="singer-container">
						{searching ? <div className="tiptxt">????????????</div> : null}
						{searching ? null : artists.map(artist => <div className="singer-line" key={artist.id} onClick={() => this.setState({ checked: checked == artist.id ? '' : artist.id })}>
							<div className="check">
								<CheckBox checked={checked == artist.id} />
							</div>
							<div className="avatar"><Image src={artist.avatar} type='api' string={artist.name} /></div>
							<div className="name"><div className="text">{artist.name}</div></div>
							<div className="fname"><div className="text">{artist.fname ?? ''}</div></div>
							<div className="counts"><div className="text">{artist.counts.albums}</div></div>
							<div className="counts"><div className="text">{artist.counts.musics}</div></div>
							<div className="birthday"><div className="text">{artist.birthday}</div></div>
							<div className="desc" title={artist.desc ?? undefined}><div className="text">{artist.desc}</div></div>
						</div>)}
						{(searching || !artists.length) ? <div className="tiptxt">???????????????</div> : null}
					</div>
				</div>
			</div>
		)
	}
}