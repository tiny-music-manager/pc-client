import './index.scss'
import React from "react"

interface ITabProps {
	className?: string
	style?: React.CSSProperties
	items: Array<{ key: string, title: string }>
	current?: string
	onChange?: (key: string) => any
}

export class Tab extends React.Component<ITabProps> {
	render() {
		const { current = this.props.items[0]?.key } = this.props
		return (
			<div className={`music-tab ${this.props.className ?? ''}`} style={this.props.style}>
				{this.props.items.map(item => <div className={`music-tab-item ${item.key === current ? 'active' : ''}`} key={item.key} onClick={() => {
					if (current != item.key && this.props.onChange) this.props.onChange(item.key)
				}}>
					<span className="music-tab-title">{item.title}</span>
					<div className="music-tab-active"></div>
				</div>)}
			</div>
		)
	}
}