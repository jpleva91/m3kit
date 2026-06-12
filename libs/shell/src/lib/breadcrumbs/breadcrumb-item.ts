/**
 * One entry of an `m3k-breadcrumbs` trail. Items with a `path` render as
 * router links; the last item (typically without a `path`) renders as the
 * plain current-page text marked `aria-current="page"`.
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
}
