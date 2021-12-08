import './editor.scss'
import { apis } from '../../../api'
import { AppbarButtons } from '../../../components/appbar/btns'
import { kindDict } from '../../../libs/consts'
import { IKind } from '../../../libs/datatype'
import { Dialog } from '../../../libs/dialog'


export interface IKindEditInfo {
	id?: string
	name: string
	type: string
	desc: string
}

interface IKindEditorState {
	info: IKindEditInfo
	kinds: Array<IKind>
}

interface IKindEditorData {
	info: IKindEditInfo
}

interface IKindEditorResult extends IKindEditInfo { }

export class KindEditor extends Dialog<IKindEditorData, IKindEditorResult, {}, IKindEditorState> {
	public static config = { name: 'kind-editor', width: 710, height: 400 }

	constructor(props: any) {
		super(props)
		this.state = {
			info: this.data.info,
			kinds: []
		}
	}

	async componentDidMount() {
		this.setState({
			kinds: await apis.kind.list({})
		})
	}

	private get validators() {
		const { info, kinds } = this.state
		return {
			get name() {
				if (!info.name.trim()) return '名称不能为空'
				if (kinds.filter(k => (k.name.trim() == info.name.trim()) && (k.id != info.id)).length) return '名称已存在'
				return null
			}
		}
	}

	render() {
		const { info } = this.state
		return (
			<div id="kind-editor" className="app-window">
				<div className="appbar">
					<div className="title">专辑信息</div>
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
									}
								})
							}} className="input" />
							<div className="error errtip">{this.validators.name}</div>
						</div>
					</div>
					{info.id ? null : <div className="editor-item">
						<div className="label">类型</div>
						<div className="input-area">
							{Object.keys(kindDict).map(key => <div key={key}
								className={`rect-selector type-item ${info.type == key ? ' selected' : ''}`}
								onClick={() => this.setState({ info: { ...info, type: key } })}
							>
								<span>{kindDict[key]}</span>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
									<path d="M691.2 725.333333l-38.4-38.4-46.933333 46.933334 81.066666 81.066666 46.933334-46.933333 85.333333-85.333333-42.666667-42.666667-85.333333 85.333333zM896 341.333333v554.666667H341.333333L896 341.333333z"></path>
								</svg>
							</div>)}
						</div>
					</div>}
					<div className="editor-item">
						<div className="label">说明</div>
						<div className="input-area">
							<textarea className="input" value={info.desc} onChange={e => {
								this.setState({ info: { ...info, desc: e.target.value } })
							}}></textarea>
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${(this.validators.name) ? 'disabled' : ''}`} onClick={() => {
						if (this.validators.name) return
						this.exit(this.state.info)
					}}>确定</div>
				</div>
			</div>
		)
	}
}