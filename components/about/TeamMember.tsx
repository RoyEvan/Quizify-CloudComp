const TeamMember = ({ image, name, position, description }) => {
  return (
    <div className="team-member">
      <img src={image} alt={name} className="team-member__image" />
      <h3 className="team-member__name">{name}</h3>
      <p className="team-member__position">{position}</p>
      <p className="team-member__description">{description}</p>
    </div>
  );
};

export default TeamMember;
