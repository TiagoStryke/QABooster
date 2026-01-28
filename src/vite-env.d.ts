declare module '*.tsx' {
	const content: any;
	export default content;
}

declare module 'electron' {
	const electron: any;
	export = electron;
}
