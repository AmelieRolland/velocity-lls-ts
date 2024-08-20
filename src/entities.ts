export interface User {
    id: number;
    firstName: string;
    lastName: string;
    departmentHierarchyId: string;
    departmentName: string;
    managerId: number;
}

export interface Users {
    items: User[];
}

export interface Squad {
    name: string;
    userIds: User['id'][];
}

export interface AuthorizedActions {
    details: boolean;
}

export interface LeavePeriod {
    id: number;
    ownerId: number;
    isConfirmed: boolean;
}

export interface UserLeaves {
    data: {
        items: [
            {
                leavePeriod: LeavePeriod,
                isAM: boolean,
                date: string,
                color: string,
                isRemoteWork: boolean,
                isRealLeave: boolean,
                leaveAccount: {
                    id: number;
                    name: string;
                    i18nLabels: [];
                    isRemoteWork: boolean;

                }
            }]
    }
}

export interface DateLeave { 
    date: string,
    name: string,
    ownerId: number,
    am: {
        isOff: boolean,
    },
    pm: {
        isOff: boolean,
    }
}