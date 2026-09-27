import { NavLink } from "@mantine/core";
import { Link, useLocation } from "react-router";

export default function Navbar({
  closeOnMobile,
}: {
  closeOnMobile: () => void;
}) {
  const location = useLocation();
  const links = ["submit-reports", "my-reports", "community-reports"];
  return (
    <>
      <NavLink
        component={Link}
        onClick={closeOnMobile}
        to="/"
        label="Home"
        active={location.pathname === "/"}
      />
      {links.map((link) => {
        return (
          <NavLink
            component={Link}
            onClick={closeOnMobile}
            to={`\\${link}`}
            label={link
              .split("-")
              .map((text) => text.charAt(0).toUpperCase() + text.slice(1))
              .join(" ")}
            active={location.pathname === `\\${link}`}
          />
        );
      })}
    </>
  );
}
