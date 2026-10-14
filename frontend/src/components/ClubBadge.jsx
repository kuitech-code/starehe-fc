import { useEffect, useState } from "react";
import stareheBadge from "../assets/y.jpg";

const DEFAULT_BADGE = `${import.meta.env.BASE_URL}team-logos/default.svg`;

function ClubBadge({ src, name, className = "", size = "medium" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src, name]);
  const isStarehe = name?.trim().toLowerCase() === "starehe fc";
  const fallbackBadge = isStarehe && !failed ? stareheBadge : DEFAULT_BADGE;
  const badgeSrc = src && !failed ? src : fallbackBadge;

  return (
    <img
      className={`club-badge club-badge-${size} ${className}`.trim()}
      src={badgeSrc}
      alt={`${name || "Team"} badge`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default ClubBadge;
