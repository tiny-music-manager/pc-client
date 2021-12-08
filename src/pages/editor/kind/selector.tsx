import './selector.scss'
import { AppbarButtons } from "../../../components/appbar/btns"
import { Loading } from "../../../components/loading"
import { IKind } from '../../../libs/datatype'
import { kindDict } from '../../../libs/consts'
import { Dialog } from '../../../libs/dialog'
import { apis } from '../../../api'



interface IKindSelectorState {
	loading: boolean						//加载
	kinds: { [i: string]: Array<IKind> }	//分类列表，类型->类型下分类
	selected: Array<string>					//选中的
}

interface IKindSelectorData {
	selected: Array<string>
}

interface IKindSelectorResult extends Array<string> { }

export class KindSelector extends Dialog<IKindSelectorData, IKindSelectorResult, {}, IKindSelectorState> {
	public static config = { name: 'kind-selector', width: 750, height: 470 }

	constructor(props: any) {
		document.title = '音乐类型选择'
		super(props)
		this.state = { loading: true, kinds: {}, selected: this.data.selected || [] }
	}

	async componentDidMount() {
		const kinds = await apis.kind.list({})
		const kindsDict: IKindSelectorState['kinds'] = {}
		kinds.forEach((kind: IKind) => {
			kindsDict[kind.type] = kindsDict[kind.type] || []
			kindsDict[kind.type].push(kind)
		})
		this.setState({ loading: false, kinds: kindsDict })
	}

	handleSelect(kind: IKind) {
		const selected = [...this.state.selected]

		let found = false
		for (let i = 0; i < selected.length; ++i) {
			if (selected[i] == kind.id) {
				selected.splice(i, 1)
				found = true
				break
			}
		}
		if (!found) selected.push(kind.id)

		this.setState({ selected })
	}

	render() {
		const { loading, kinds, selected } = this.state
		return (
			<div id="kind-selector" className="app-window">
				{/* 标题栏 */}
				<div className="appbar">
					<div className="title">音乐类型选择</div>
					<AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				<div className="appbody">
					{/* loading */}
					<div className="loading" style={{ display: loading ? '' : 'none' }}>
						<Loading className="rotate-icon" />
						<div>正在加载中</div>
					</div>
					{/* 内容 */}
					<div className="content" style={{ display: loading ? 'none' : '' }}>
						{Object.keys(kindDict).map(key => <div className="kind-group" key={key}>
							<div className="groupname">{kindDict[key]}</div>
							<div className="kind-items">
								{kinds[key]?.map(kind => <div
									className={`kind-item rect-selector ${selected.includes(kind.id) ? 'selected' : ''}`}
									key={kind.id}
									title={kind.desc || undefined}
									onClick={() => this.handleSelect(kind)}
								>
									<span>{kind.name}</span>
									<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
										<path d="M691.2 725.333333l-38.4-38.4-46.933333 46.933334 81.066666 81.066666 46.933334-46.933333 85.333333-85.333333-42.666667-42.666667-85.333333 85.333333zM896 341.333333v554.666667H341.333333L896 341.333333z"></path>
									</svg>
								</div>)}
							</div>
						</div>)}
					</div>
				</div>
				<div className="appfooter">
					<div className="button" onClick={() => this.exit(selected)}>取消</div>
					<div className={`button ${loading ? 'disabled' : ''}`} onClick={() => this.exit(selected)}>完成选择并应用</div>
				</div>
			</div>
		)
	}
}