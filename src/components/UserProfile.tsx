interface UserData {
    name: string;
    email: string;
    phoneNumber: string;
    year: string;
    major: string;
    instrument: string;
    returning: string;
    ownsInstrument: string;
    readsMusic: string;
    notes: string;
    role: string;
  }
  
  interface UserProfileProps {
    userData: UserData;
  }
  
  const UserProfile: React.FC<UserProfileProps> = ({ userData }) => {
    return (
      <div style={{ marginTop: '1rem' }}>
        <p><strong>Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone Number:</strong> {userData.phoneNumber}</p>
        <p><strong>Year:</strong> {userData.year}</p>
        <p><strong>Major:</strong> {userData.major}</p>
        <p><strong>Instrument:</strong> {userData.instrument}</p>
        <p><strong>Returning Member:</strong> {userData.returning}</p>
        <p><strong>Reads Sheet Music:</strong> {userData.readsMusic}</p>
        <p><strong>Owns Instrument:</strong> {userData.ownsInstrument}</p>
        <p><strong>Additional Notes:</strong> {userData.notes}</p>
        <p><strong>Role:</strong> {userData.role}</p>
      </div>
    );
  };
  
  export default UserProfile;
  