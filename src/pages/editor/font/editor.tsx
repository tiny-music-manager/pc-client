import './editor.scss'
import { AppbarButtons } from "../../../components/appbar/btns"
import { IFont } from "../../../libs/datatype"
import { Dialog } from "../../../libs/dialog"

interface IFontEditorState {
	info: IFont
	file?: string
}

interface IFontEditorData {
	font?: IFont
}

interface IFontEditorResult extends IFont {
	ufile: string
}

export class FontEditor extends Dialog<IFontEditorData, IFontEditorResult, {}, IFontEditorState> {
	public static config = { name: 'font-editor', width: 550, height: 300 }

	constructor(props: any) {
		super(props)
		this.state = {
			info: this.data.font ? { ...this.data.font } : { id: '', name: '', file: '' }
		}
	}

	get validators() {
		const { info, file } = this.state
		return {
			get name() {
				const name = info.name.trim()
				if (!name) return '字体名称不能为空'
				if (name.length > 20) return '字体名称太长'
				return null
			},
			get file() {
				if (!file && !info.file) return '字体文件不能为空'
				return null
			}
		}
	}

	private handleSelectFont() {
		const input = document.createElement('input')
		input.type = 'file'
		input.oninput = async () => {
			try {
				const file = input.files?.[0]
				if (!file) return
				const ab = await file.arrayBuffer()
				var bytes = new Uint8Array(ab);
				console.log(bytes)
				if (
					//ttf
					(bytes[0] == 0 && bytes[1] == 1 && bytes[2] == 0 && bytes[3] == 0 && bytes[4] == 0) ||
					//ttc
					(bytes[0] == 116 && bytes[1] == 116 && bytes[2] == 99 && bytes[3] == 102)
				) {
					this.setState({
						info: { ...this.state.info, file: '' },
						file: file.path,
					})
				}
			} catch (err) {
				return
			}
		}
		input.click()
	}

	render() {
		const { info, file } = this.state
		return (
			<div id="font-editor" className="app-window">
				<div className="appbar">
					<div className="title">字体上传</div>
					<AppbarButtons btns={['close']}
						onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				<div className="appbody">
					<div className="editor-item">
						<div className="label">名称</div>
						<div className="input-area">
							<input value={info.name} onChange={e => {
								this.setState({
									info: {
										...info,
										name: e.target.value,
									}
								})
							}} className="input" />
							<div className="error errtip">{this.validators.name}</div>
						</div>
					</div>
					<div className="editor-item">
						<div className="label">字体文件</div>
						<div className="input-area">
							<div className="file-name"><span className="link" onClick={this.handleSelectFont.bind(this)}>{
								(() => {
									if (file) return `[未上传] ${nativeApi.path.basename(file)}`
									if (info.id) return `[已上传] ${nativeApi.path.basename(info.file)}`
									return '请选择'
								})()
							}</span></div>
							<div className="error errtip">{this.validators.file}</div>
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${(this.validators.name || this.validators.file) ? 'disabled' : ''}`} onClick={() => {
						if (this.validators.name || this.validators.file) return
						this.exit({
							...this.state.info,
							ufile: this.state.file ?? '',
						})
					}}>确定</div>
				</div>
			</div>
		)
	}

}