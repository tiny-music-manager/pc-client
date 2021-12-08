import './index.scss'
import { apis } from "../../api"
import { MusicGroup, MusicGroupItem } from "../../components/music-group"
import { i18n } from "../../i18n"
import { history, kindDict } from "../../libs/consts"
import { IKind } from "../../libs/datatype"
import { Page } from "../../libs/page"
import { KindDetailPage } from "./detail"

export { KindDetailPage }

interface IKindPageState {
	kinds: Array<IKind>
}

export class KindPage extends Page<{}, IKindPageState> {

	async componentDidMount() {
		const kinds = await apis.kind.list({})
		this.setState({ kinds })
	}

	render() {
		const { kinds } = this.state ?? {}
		return (
			<div id="kind-page">
				{/* 标题 */}
				<div className="page-title">{i18n.kind.title.string}</div>
				{/* 分类列表 */}
				<div className="music-group-container">
					{kinds ? Object.keys(kindDict).map(key => <MusicGroup
						key={key}
						title={kindDict[key]}
						pageMode="list"
						data={kinds.filter(k => k.type == key)}
						titleHeight={50}
						pwidth={0.6}
						itemRender={kind => <MusicGroupItem
							key={kind.id}
							title={kind.name}
							onClick={() => history.push(`/kind/${kind.id}`)}
						/>}
					/>) : null}
				</div>
			</div>
		)
	}
}