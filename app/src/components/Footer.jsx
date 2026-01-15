import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <p>
        Use of this site constitutes acceptance of our{" "}
        <a href="/user-agreement">User Agreement</a> and{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
        <br />
        © 2025 Project Playbook. All rights reserved.
      </p>
      <p>
        PROJECT PLAYBOOK and the PROJECT PLAYBOOK Logo are registered trademarks
        of Project Playbook Company.
      </p>
    </footer>
  );
};

export default Footer;
