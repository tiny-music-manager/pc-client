import './editor.scss'
import { AppbarButtons } from "../../../components/appbar/btns"
import { IKind, IMusic } from "../../../libs/datatype"
import { Dialog } from "../../../libs/dialog"
import { Image } from '../../../components/image/image'
import { ArtistSelector } from '../artist/selector'
import { AlbumSelector } from '../album/selector'
import { apis } from '../../../api'
import { KindSelector } from '../kind/selector'
import { util } from '../../../libs/util'
import { createDialog } from '../../../components/popover'
import { Loading } from '../../../components/loading'

type TArray<A> = A extends Array<infer R> ? R : A

interface IMusicEditorState {
	info: IMusic | null
	kinds: Array<IKind>
	picFile?: { base64: string, path: string }
}

interface IMusicEditorData {
	music: IMusic | string
}

interface IMusicEditorResult extends IMusic {
	imageFile?: string
}

export class MusicEditor extends Dialog<IMusicEditorData, IMusicEditorResult, {}, IMusicEditorState> {
	public static config = { name: 'music-editor', width: 770, height: 500 }

	constructor(props: any) {
		super(props)
		this.state = {
			info: null,
			kinds: [],
		}
	}

	public async componentDidMount() {
		let info: IMusic
		if (typeof this.data.music == 'string') info = await apis.music.info({ id: this.data.music })
		else info = this.data.music

		const kinds = await apis.kind.list({})
		this.setState({ kinds, info })
	}


	private handleInput<K extends keyof IMusic>(key: K, val: IMusic[K]) {
		if (!this.state.info) return
		this.setState({
			info: {
				...this.state.info,
				[key]: val,
			}
		})
	}

	private async handleAddArtist() {
		if (!this.state.info) return
		const result = await ArtistSelector.open({ exclude: this.state.info.artists.map(a => a.id) })
		if (!result) return
		this.setState({
			info: {
				...this.state.info,
				artists: [...this.state.info.artists, {
					id: result.id,
					name: result.name,
					fname: result.fname,
					birthday: result.birthday,
					avatar: result.avatar,
				}]
			}
		})
	}

	private async handleRemoveArtist(artist: TArray<IMusic['artists']>) {
		if (!this.state.info) return
		if (!await createDialog('删除歌手', `是否删除歌手“${artist.name}”？`).wait()) return
		this.setState({
			info: {
				...this.state.info,
				artists: this.state.info.artists.filter(a => a.id != artist.id)
			}
		})
	}

	private async handleAddAlbum() {
		if (!this.state.info) return
		const result = await AlbumSelector.open({ exclude: this.state.info.albums.map(a => a.id) })
		if (!result) return
		this.setState({
			info: {
				...this.state.info,
				albums: [...this.state.info.albums, {
					id: result.id,
					name: result.name,
					issue: result.issue,
					pic: result.pic,
				}]
			}
		})
	}

	private async handleRemoveAlbum(album: TArray<IMusic['albums']>) {
		if (!this.state.info) return
		if (!await createDialog('删除专辑', `是否删除专辑《${album.name}》？`).wait()) return
		this.setState({
			info: {
				...this.state.info,
				albums: this.state.info.albums.filter(a => a.id != album.id)
			}
		})
	}

	private async handleSelectKinds() {
		if (!this.state.info) return
		const result = await KindSelector.open({ selected: this.state.info.types })
		if (!result) return
		this.setState({ info: { ...this.state.info, types: result } })
	}

	private handleChoosePic() {
		if (!this.state.info) return
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/jpg,image/jpeg,image/png,image/webp'
		input.oninput = async () => {
			if (!this.state.info) return
			try {
				const file = input.files?.[0]
				if (!file) return
				const ab = await file.arrayBuffer()
				const base64String = util.arrayBufferToBase64(ab)
				this.setState({
					info: {
						...this.state.info,
						image: '',
					},
					picFile: { path: file.path, base64: `data:${file.type};base64,${base64String}` }
				})
			} catch (err) {
				return
			}
		}
		input.click()
	}

	private get validators() {
		const { info } = this.state
		return {
			get name() {
				if (!info?.name?.trim()) return `歌曲名称不能为空`
				if (info?.name?.trim().length > 255) return `歌曲名称太长`
				return null
			}
		}
	}

	render() {
		const { info, picFile } = this.state

		const kinds = info?.types.map(kid => this.state.kinds.filter(k => k.id == kid)[0]).filter(k => !!k) ?? []

		return (
			<div id="music-editor" className="app-window">
				<div className="appbar">
					<div className="title">音乐信息</div>
					<AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				{info ? <div className="appbody">
					<div className="editor-item">
						<div className="label">歌曲名</div>
						<div className="input-area">
							<input type="text" className="input" value={info.name} onChange={e => this.handleInput('name', e.target.value)} />
							<div className="error errtip">{this.validators.name}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">歌手</div>
						<div className="input-area">
							{info.artists.map(artist => <div key={artist.id} className="artist-album">
								<Image className="avatar" src={artist.avatar} type='api' string={artist.name} />
								<div className="name">{artist.name}</div>
								<div className="delete" onClick={() => this.handleRemoveArtist(artist)}>
									<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
										<path d="M507.168 473.232L716.48 263.936a16 16 0 0 1 22.624 0l11.312 11.312a16 16 0 0 1 0 22.624L541.12 507.168 750.4 716.48a16 16 0 0 1 0 22.624l-11.312 11.312a16 16 0 0 1-22.624 0L507.168 541.12 297.872 750.4a16 16 0 0 1-22.624 0l-11.312-11.312a16 16 0 0 1 0-22.624l209.296-209.312-209.296-209.296a16 16 0 0 1 0-22.624l11.312-11.312a16 16 0 0 1 22.624 0l209.296 209.296z"></path>
									</svg>
								</div>
							</div>)}
							<div className="choose-btn link" onClick={() => this.handleAddArtist()}>添加</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">专辑</div>
						<div className="input-area">
							{info.albums.map(album => <div key={album.id} className="artist-album">
								<Image className="avatar" src={album.pic} type='api' string={album.name} />
								<div className="name">{album.name}</div>
								<div className="delete" onClick={() => this.handleRemoveAlbum(album)}>
									<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
										<path d="M507.168 473.232L716.48 263.936a16 16 0 0 1 22.624 0l11.312 11.312a16 16 0 0 1 0 22.624L541.12 507.168 750.4 716.48a16 16 0 0 1 0 22.624l-11.312 11.312a16 16 0 0 1-22.624 0L507.168 541.12 297.872 750.4a16 16 0 0 1-22.624 0l-11.312-11.312a16 16 0 0 1 0-22.624l209.296-209.312-209.296-209.296a16 16 0 0 1 0-22.624l11.312-11.312a16 16 0 0 1 22.624 0l209.296 209.296z"></path>
									</svg>
								</div>
							</div>)}
							<div className="choose-btn link" onClick={() => this.handleAddAlbum()}>添加</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">分类</div>
						<div className="input-area">
							{kinds.map(kind => <div key={kind.id} className="kind-name">{kind.name}</div>)}
							<div className="choose-btn link" onClick={() => this.handleSelectKinds()}>选择</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">封面</div>
						<div className="input-area">
							<Image
								className="image"
								src={info.image || picFile?.base64 || ''}
								type='api'
								string={info.name}
								onClick={() => this.handleChoosePic()} />
						</div>
					</div>
				</div> : <div className="appbody loading">
					<Loading style={{ fontSize: '2em' }} />
					<div style={{ marginTop: 20 }}>正在加载...</div>
				</div>}
				{info ? <div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${this.validators.name ? 'disabled' : ''}`} onClick={() => {
						if (!info) return
						if (this.validators.name) return
						this.exit({
							...info,
							imageFile: this.state.picFile?.path,
						})
					}}>保存歌曲信息</div>
				</div> : null}
			</div>
		)
	}

}