// this component is used to call the users name anywhere using <CurrentUserName />
import { useUser } from "../auth/UserContext";

export default function CurrentUserName({ fallback = "there", showEmailIfNoName = true }) {
    const { profile, firebaseUser, loading } = useUser();
    
    if (loading) {
        return <>...</>;
    }

    let name = 
        profile?.displayName ||
        firebaseUser?.displayName ||
        (showEmailIfNoName ? firebaseUser?.email : null) ||
        fallback;

    return <>{name}</>
}
