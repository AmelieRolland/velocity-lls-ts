export interface User {
    id: number
    firstName: string
    lastName: string
    departmentHierarchyId: string
    departmentName: string
    managerId: number
}

export interface Users {
    items: User[]
}

export interface Squad {
    name: string
    userIds: User['id'][]
}

export interface LeavePeriod {
    id: number
    ownerId: number
    isConfirmed: boolean
}

export interface LeaveItem {
    leavePeriod: LeavePeriod
    isAM: boolean
    date: string
    color: string
    isRemoteWork: boolean
    isRealLeave: boolean
}

export interface UserLeaves {
    data: {
        items: LeaveItem[]
    }
}
export interface GroupedByDate {
    date: LeaveItem[]
}
export interface AbsentUsers {
    userName: string
    presenceDays: number
    absences: string[]
}

export interface Absences {
    userName: string
    daysAbsent: number
}
export interface IsOff {
    isOff :boolean
}

export interface DateLeave { 
    
    date: string
    name: string
    ownerId: number
    am: {isOff: boolean}
    pm: {isOff:boolean}
}