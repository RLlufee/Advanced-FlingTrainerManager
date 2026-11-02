/**
 * @file DownloadView.tsx
 * @description DownloadView 转发器，向后兼容旧引用，具体实现已拆分至 ./download/
 */
export * from "./download";
export { DownloadView as default } from "./download";
