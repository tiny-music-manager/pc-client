import './kind.scss'
import { createDialog } from '../../components/popover'
import { apis } from '../../api'
import { IKind } from '../../libs/datatype'
import { kindDict } from '../../libs/consts'
import { KindEditor } from '../editor/kind/editor'
import { TMMComponent } from '../../libs/component'

interface IMusicKindManagePageState {
	kinds: Array<IKind>
	selected: string
}

export class MusicKindManagePage extends TMMComponent<any, IMusicKindManagePageState> {

	private static kindsCache: Array<IKind> = []

	async componentDidMount() {
		this.setState({ kinds: MusicKindManagePage.kindsCache })
		this.loadKinds()
	}

	private async loadKinds() {
		const kinds = MusicKindManagePage.kindsCache = await apis.kind.list({})
		this.setState({ kinds })
	}

	private get selected(): IKind | null {
		return this.state?.kinds?.filter?.(k => k.id == this.state?.selected)?.[0] ?? null
	}

	private async handleEditKind(type: 'add' | 'edit') {
		const kind = type == 'edit' ? this.selected : null
		if (type == 'edit' && !kind) return

		const result = await KindEditor.open({
			info: {
				id: kind?.id,
				name: kind?.name ?? '',
				type: kind?.type ?? 'years',
				desc: kind?.desc ?? '',
			}
		})
		if (!result || !result.name) return
		if (this.state.kinds.filter(k => (k.name.trim() == result.name.trim()) && (k.id != result.id)).length) return

		await apis.kind.save({ id: kind?.id, name: result.name, type: result.type, desc: result.desc ?? '' })
		await this.loadKinds()
	}

	private async handleRemoveKind() {
		const kind = this.selected
		if (!kind) return
		if (!await createDialog('删除分类', `是否删除分类“${kind.name}”？`).wait()) return
		await apis.kind.remove({ id: kind.id })
		this.setState({ selected: '' })
		await this.loadKinds()
	}

	render() {
		const { kinds = [], selected = '' } = this.state ?? {}
		return (
			<div className="manage-kind">
				<div className="button-area">
					<div className="button" onClick={() => this.handleEditKind('add')}>添加分类</div>
					<div className={`button ${selected ? '' : ' disabled'}`} onClick={() => this.handleEditKind('edit')}>修改分类</div>
					<div className={`button ${selected ? '' : ' disabled'}`} onClick={() => this.handleRemoveKind()}>删除分类</div>
				</div>
				<div className="body">
					{Object.keys(kindDict).map(key => <div className="kind-group" key={key}>
						<div className="kind-group-name">{kindDict[key]}</div>
						<div className="kind-list">
							{kinds.filter(k => k.type == key).map(kind => <div
								className={`kind-list-item ${kind.id == selected ? 'selected' : ''}`}
								key={kind.id}
								title={kind.desc || undefined}
								onClick={() => this.setState({ selected: kind.id == selected ? '' : kind.id })}
							>
								<div className="kind-name">
									<span className="main">{kind.name}</span>
								</div>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
									<path d="M691.2 725.333333l-38.4-38.4-46.933333 46.933334 81.066666 81.066666 46.933334-46.933333 85.333333-85.333333-42.666667-42.666667-85.333333 85.333333zM896 341.333333v554.666667H341.333333L896 341.333333z"></path>
								</svg>
							</div>)}
						</div>
					</div>)}
				</div>
			</div>
		)
	}

}