//Auto generated with the dashboard resposeses from Grafana API, not all fields are necessarily used in the code, but they are included here for completeness and potential future use.

export interface GrafanaDashboard {
    meta:      Meta;
    dashboard: GrafanaDashboardDashboard;
}

export interface GrafanaDashboardDashboard {
    annotations:          Annotations;
    editable:             boolean;
    fiscalYearStartMonth: number;
    graphTooltip:         number;
    id:                   number;
    links:                any[];
    panels:               Panel[];
    refresh:              string;
    schemaVersion:        number;
    tags:                 any[];
    templating:           Annotations;
    time:                 Time;
    timepicker:           Timepicker;
    timezone:             string;
    title:                string;
    uid:                  string;
    version:              number;
    weekStart:            string;
}

export interface Annotations {
    list: List[];
}

export interface List {
    builtIn:    number;
    datasource: Datasource;
    enable:     boolean;
    hide:       boolean;
    iconColor:  string;
    name:       string;
    type:       string;
}

export interface Datasource {
    type: string;
    uid:  string;
}

export interface TextPanel {
    type:        'text';
    title:       string;
    description?: string;
    content?:    string;
    mode?:       'markdown' | 'html' | 'code';
    gridPos?:    GridPos;
    id?:         number;
}

export interface Target {
    refId:       string;
    datasource?: Datasource;
    expr?:       string;
}

export interface TimeSeriesPanel {
    type:         'timeseries';
    title:        string;
    description?: string;
    datasource?:  Datasource;
    gridPos?:     GridPos;
    id?:          number;
    targets?:     Target[];
    fieldConfig?: any;
    options?:     any;
}

export type Panel = TextPanel | TimeSeriesPanel;

export interface GridPos {
    h?: number;
    w?: number;
    x?: number;
    y?: number;
}

export interface Time {
    from: string;
    to:   string;
}

export interface Timepicker {
}

export interface Meta {
    type:                   string;
    canSave:                boolean;
    canEdit:                boolean;
    canAdmin:               boolean;
    canStar:                boolean;
    canDelete:              boolean;
    slug:                   string;
    url:                    string;
    expires:                Date;
    created:                Date;
    updated:                Date;
    updatedBy:              string;
    createdBy:              string;
    version:                number;
    hasAcl:                 boolean;
    isFolder:               boolean;
    apiVersion:             string;
    folderId:               number;
    folderUid:              string;
    folderTitle:            string;
    folderUrl:              string;
    provisioned:            boolean;
    provisionedExternalId:  string;
    annotationsPermissions: AnnotationsPermissions;
}

export interface AnnotationsPermissions {
    dashboard: AnnotationsPermissionsDashboard;
}

export interface AnnotationsPermissionsDashboard {
    canAdd:    boolean;
    canEdit:   boolean;
    canDelete: boolean;
}
