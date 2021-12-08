import './editor.scss'
import { createDialog } from '../../../components/popover'
import { Image } from '../../../components/image/image'
import { AppbarButtons } from '../../../components/appbar/btns'
import { util } from '../../../libs/util'
import { ArtistSelector } from '.././artist/selector'
import { Dialog } from '../../../libs/dialog'

export interface IAlbumEditInfo {
	id?: string,
	name: string,
	issue: string
	artists: Array<{ id: string, name: string, avatar: string }>
	desc: string
	pic: string
	picFile?: { path: string, base64: string }
}

interface IAlbumEditorState {
	info: IAlbumEditInfo
}

interface IAlbumEditorData {
	info: IAlbumEditInfo
}

interface IAlbumEditorResult extends IAlbumEditInfo { }

export class AlbumEditor extends Dialog<IAlbumEditorData, IAlbumEditorResult, {}, IAlbumEditorState> {
	public static config = { name: 'album-editor', width: 800, height: 545 }

	constructor(props: any) {
		super(props)
		this.state = {
			info: this.data.info,
		}
	}

	private handleInput(name: Exclude<keyof IAlbumEditorState['info'], 'picFile' | 'artists'>, val: string) {
		this.setState({
			info: {
				...this.state.info,
				[name]: val
			}
		})
	}

	private handleChoosePic() {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/jpg,image/jpeg,image/png,image/webp'
		input.oninput = async () => {
			try {
				const file = input.files?.[0]
				if (!file) return
				const ab = await file.arrayBuffer()
				const base64String = util.arrayBufferToBase64(ab)
				this.setState({
					info: {
						...this.state.info,
						pic: '',
						picFile: { path: file.path, base64: `data:${file.type};base64,${base64String}` }
					}
				})
			} catch (err) {
				return
			}
		}
		input.click()
	}

	private async handleAddArtist() {
		const result = await ArtistSelector.open({ exclude: this.state.info.artists.map(a => a.id) })
		if (!result) return
		this.setState({
			info: {
				...this.state.info,
				artists: [
					...this.state.info.artists,
					{ id: result.id, name: result.name, avatar: result.avatar }
				]
			}
		})
	}

	private async handleRemoveArtist(artist: { id: string, name: string }) {
		if (!await createDialog('删除歌手', `是否删除歌手“${artist.name}”？`).wait()) return

		this.setState({
			info: {
				...this.state.info,
				artists: this.state.info.artists.filter(a => a.id != artist.id)
			}
		})
	}

	private get validators() {
		const { info } = this.state
		return {
			get name() {
				if (!info.name.trim()) return '专辑名称不能为空'
				return null
			},
			get issue() {
				if (!/^\d{4}-\d{2}-\d{2}$/.test(info.issue.trim())) return '日期格式错误'
				return null
			}
		}
	}

	render() {
		const { info } = this.state
		return (
			<div id="album-editor" className="app-window">
				<div className="appbar">
					<div className="title">专辑信息</div>
					<AppbarButtons btns={['close']}
						onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				<div className="appbody">
					<div className="editor-item">
						<div className="label">名字</div>
						<div className="input-area">
							<input type="text" className="input" value={info.name} onChange={e => this.handleInput('name', e.target.value)} />
							<div className="error errtip">{this.validators.name}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">发行时间</div>
						<div className="input-area">
							<input type="text" className="input" value={info.issue} onChange={e => this.handleInput('issue', e.target.value)} />
							<div className="error errtip">{this.validators.issue}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">封面</div>
						<div className="input-area">
							<Image
								className="pic"
								src={info.pic || info.picFile?.base64 || ''}
								type='api'
								string={info.name}
								onClick={() => this.handleChoosePic()} />
						</div>
					</div>
					<div className="editor-item">
						<div className="label">歌手</div>
						<div className="input-area">
							{info.artists.map(a => <div key={a.id} className="artist-item">
								<Image className="avatar" src={a.avatar} type='api' string={a.name} />
								<div className="name">{a.name}</div>
								<div className="delete" onClick={() => this.handleRemoveArtist(a)}>
									<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
										<path d="M507.168 473.232L716.48 263.936a16 16 0 0 1 22.624 0l11.312 11.312a16 16 0 0 1 0 22.624L541.12 507.168 750.4 716.48a16 16 0 0 1 0 22.624l-11.312 11.312a16 16 0 0 1-22.624 0L507.168 541.12 297.872 750.4a16 16 0 0 1-22.624 0l-11.312-11.312a16 16 0 0 1 0-22.624l209.296-209.312-209.296-209.296a16 16 0 0 1 0-22.624l11.312-11.312a16 16 0 0 1 22.624 0l209.296 209.296z"></path>
									</svg>
								</div>
							</div>)}
							<div className="singer-join link" onClick={() => this.handleAddArtist()}>添加歌手</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">说明</div>
						<div className="input-area">
							<textarea className="input" value={info.desc} onChange={e => this.handleInput('desc', e.target.value)} />
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${(this.validators.name || this.validators.issue) ? 'disabled' : ''}`} onClick={() => {
						if (this.validators.name || this.validators.issue) return
						this.exit({
							...this.state.info,
							picFile: { path: this.state.info.picFile?.path ?? '', base64: '' }
						})
					}}>确定</div>
				</div>
			</div>
		)
	}
}