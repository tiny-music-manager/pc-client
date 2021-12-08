import './editor.scss'
import { AppbarButtons } from '../../../components/appbar/btns';
import { Image } from '../../../components/image/image';
import { Dialog } from '../../../libs/dialog';
import { util } from '../../../libs/util';

interface IArtistEditInfo {
	id?: string
	name: string
	fname: string
	birthday: string
	desc: string
	avatar: string
	avatarFile?: { path: string, base64: string }
}


interface IArtistEditorState {
	info: IArtistEditInfo
}

interface IArtistEditorData {
	info: IArtistEditInfo
}

interface IArtistEditorResult extends IArtistEditInfo { }

export class ArtistEditor extends Dialog<IArtistEditorData, IArtistEditorResult, {}, IArtistEditorState> {
	public static config = { name: 'artist-editor', width: 800, height: 540 }

	constructor(props: any) {
		super(props)
		this.state = {
			info: this.data.info
		}
	}

	private handleInput<K extends keyof IArtistEditorData['info']>(name: K, val: IArtistEditorData['info'][K]) {
		this.setState({ info: { ...this.state.info, [name]: val } })
	}

	private handleChooseAvatar() {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/jpg,image/jpeg,image/png,image/webp'
		input.oninput = async () => {
			try {
				const file = input.files?.[0]
				if (!file) return
				const ab = await file.arrayBuffer()
				const base64String = util.arrayBufferToBase64(ab)
				this.handleInput('avatar', '')
				this.handleInput('avatarFile', { path: file.path, base64: `data:${file.type};base64,${base64String}` })
			} catch (err) {
				return
			}
		}
		input.click()
	}

	private get validators() {
		const result = this.state.info
		return {
			get name() {
				if (!result.name.trim()) return '歌手名字不能为空'
				return null
			},
			get birthday() {
				if (!/^\d{4}-\d{2}-\d{2}$/.test(result.birthday)) return '生日格式不正确'
				return null
			}
		}
	}

	render() {
		const { info } = this.state
		return (
			<div id="artist-editor" className="app-window">
				<div className="appbar">
					<div className="title">歌手信息编辑</div>
					<AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
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
						<div className="label">英文名</div>
						<div className="input-area">
							<input type="text" className="input" value={info.fname} onChange={e => this.handleInput('fname', e.target.value)} />
						</div>
					</div>
					<div className="editor-item">
						<div className="label">生日</div>
						<div className="input-area">
							<input type="text" className="input" value={info.birthday} onChange={e => this.handleInput('birthday', e.target.value)} />
							<div className="error errtip">{this.validators.birthday}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">头像</div>
						<div className="input-area">
							<Image
								className="avatar"
								src={info.avatar || info.avatarFile?.base64 || ''}
								type='api'
								string={info.name}
								onClick={() => this.handleChooseAvatar()} />
						</div>
					</div>
					<div className="editor-item">
						<div className="label">介绍</div>
						<div className="input-area">
							<textarea className="input" value={info.desc} onChange={e => this.handleInput('desc', e.target.value)} />
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${(this.validators.name || this.validators.birthday) ? 'disabled' : ''}`} onClick={() => {
						if (this.validators.name || this.validators.birthday) return
						this.exit({
							...info,
							avatarFile: info.avatarFile ? { base64: '', path: info.avatarFile.path } : undefined
						})
					}}>保存信息</div>
				</div>
			</div>
		)
	}
}