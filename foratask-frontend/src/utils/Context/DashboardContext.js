import React, { createContext, useState } from "react";
export const DashboardContext = createContext();
export const DashboardProvider = ({ children }) => {
    const [isSelfTask, setIsSelfTask] = React.useState(false)
    const [summary, setSummary] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [widthComp, setWidthComp] = useState(0);


    return <DashboardContext.Provider value={{ isSelfTask, setIsSelfTask, summary, setSummary, loading, setLoading, widthComp, setWidthComp }}>
        {children}
    </DashboardContext.Provider>
} 