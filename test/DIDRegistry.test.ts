import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DIDRegistry", function () {
  let didRegistry: any;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  const testDID = ethers.keccak256(ethers.toUtf8Bytes("did:idverse:alice123"));
  const testDID2 = ethers.keccak256(ethers.toUtf8Bytes("did:idverse:bob456"));
  const testDocPointer = "ipfs://QmExampleDIDDocument123";
  const updatedDocPointer = "ipfs://QmUpdatedDIDDocument456";

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    didRegistry = await ethers.deployContract("DIDRegistry");
  });

  describe("DID Registration", function () {
    it("Should register a new DID successfully", async function () {
      await expect(
        didRegistry.registerDID(testDID, alice.address, testDocPointer)
      )
        .to.emit(didRegistry, "DIDRegistered")
        .withArgs(testDID, alice.address, testDocPointer);

      const controller = await didRegistry.getController(testDID);
      expect(controller).to.equal(alice.address);

      const docPointer = await didRegistry.getDocPointer(testDID);
      expect(docPointer).to.equal(testDocPointer);
    });

    it("Should prevent duplicate DID registration", async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);

      await expect(
        didRegistry.registerDID(testDID, bob.address, testDocPointer)
      ).to.be.revertedWith("DID already registered");
    });

    it("Should allow multiple different DIDs to be registered", async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
      await didRegistry.registerDID(testDID2, bob.address, testDocPointer);

      const controller1 = await didRegistry.getController(testDID);
      const controller2 = await didRegistry.getController(testDID2);

      expect(controller1).to.equal(alice.address);
      expect(controller2).to.equal(bob.address);
    });

    it("Should emit correct event on registration", async function () {
      const tx = await didRegistry.registerDID(
        testDID,
        alice.address,
        testDocPointer
      );
      const receipt = await tx.wait();

      // Verify event was emitted
      const events = receipt?.logs;
      expect(events?.length).to.be.greaterThan(0);
    });

    it("Should allow registration with zero-length document pointer", async function () {
      await expect(
        didRegistry.registerDID(testDID, alice.address, "")
      ).to.not.be.reverted;

      const docPointer = await didRegistry.getDocPointer(testDID);
      expect(docPointer).to.equal("");
    });
  });

  describe("Controller Management", function () {
    beforeEach(async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
    });

    it("Should allow controller to update to new controller", async function () {
      await expect(
        didRegistry.connect(alice).updateController(testDID, bob.address)
      )
        .to.emit(didRegistry, "ControllerChanged")
        .withArgs(testDID, alice.address, bob.address);

      const newController = await didRegistry.getController(testDID);
      expect(newController).to.equal(bob.address);
    });

    it("Should prevent non-controller from updating controller", async function () {
      await expect(
        didRegistry.connect(bob).updateController(testDID, bob.address)
      ).to.be.revertedWith("only controller");
    });

    it("Should prevent updating controller of unregistered DID", async function () {
      const unregisteredDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:unregistered")
      );
      await expect(
        didRegistry.connect(alice).updateController(unregisteredDID, bob.address)
      ).to.be.revertedWith("only controller");
    });

    it("Should allow new controller to make further updates", async function () {
      // Alice transfers to Bob
      await didRegistry.connect(alice).updateController(testDID, bob.address);

      // Bob transfers to Charlie
      await expect(
        didRegistry.connect(bob).updateController(testDID, charlie.address)
      ).to.not.be.reverted;

      const finalController = await didRegistry.getController(testDID);
      expect(finalController).to.equal(charlie.address);
    });

    it("Should prevent old controller from making updates after transfer", async function () {
      await didRegistry.connect(alice).updateController(testDID, bob.address);

      await expect(
        didRegistry.connect(alice).updateController(testDID, charlie.address)
      ).to.be.revertedWith("only controller");
    });
  });

  describe("Document Pointer Management", function () {
    beforeEach(async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
    });

    it("Should allow controller to update document pointer", async function () {
      await expect(
        didRegistry.connect(alice).updateDocPointer(testDID, updatedDocPointer)
      )
        .to.emit(didRegistry, "DIDDocUpdated")
        .withArgs(testDID, updatedDocPointer);

      const newPointer = await didRegistry.getDocPointer(testDID);
      expect(newPointer).to.equal(updatedDocPointer);
    });

    it("Should prevent non-controller from updating document pointer", async function () {
      await expect(
        didRegistry.connect(bob).updateDocPointer(testDID, updatedDocPointer)
      ).to.be.revertedWith("only controller");
    });

    it("Should allow multiple updates to document pointer", async function () {
      await didRegistry
        .connect(alice)
        .updateDocPointer(testDID, updatedDocPointer);
      const pointer1 = await didRegistry.getDocPointer(testDID);
      expect(pointer1).to.equal(updatedDocPointer);

      const pointer2 = "ipfs://QmAnotherUpdate789";
      await didRegistry.connect(alice).updateDocPointer(testDID, pointer2);
      const finalPointer = await didRegistry.getDocPointer(testDID);
      expect(finalPointer).to.equal(pointer2);
    });

    it("Should allow setting document pointer to empty string", async function () {
      await expect(
        didRegistry.connect(alice).updateDocPointer(testDID, "")
      ).to.not.be.reverted;

      const emptyPointer = await didRegistry.getDocPointer(testDID);
      expect(emptyPointer).to.equal("");
    });

    it("Should prevent updating document pointer of unregistered DID", async function () {
      const unregisteredDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:unregistered")
      );
      await expect(
        didRegistry.connect(alice).updateDocPointer(unregisteredDID, updatedDocPointer)
      ).to.be.revertedWith("only controller");
    });
  });

  describe("Query Functions", function () {
    it("Should return zero address for unregistered DID controller", async function () {
      const unregisteredDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:unregistered")
      );
      const controller = await didRegistry.getController(unregisteredDID);
      expect(controller).to.equal(ethers.ZeroAddress);
    });

    it("Should return empty string for unregistered DID document pointer", async function () {
      const unregisteredDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:unregistered")
      );
      const docPointer = await didRegistry.getDocPointer(unregisteredDID);
      expect(docPointer).to.equal("");
    });

    it("Should correctly query controller via public mapping", async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
      const controller = await didRegistry.controller(testDID);
      expect(controller).to.equal(alice.address);
    });

    it("Should correctly query document pointer via public mapping", async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
      const pointer = await didRegistry.docPointer(testDID);
      expect(pointer).to.equal(testDocPointer);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle long IPFS CIDs", async function () {
      const longCID =
        "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme.md";
      await expect(
        didRegistry.registerDID(testDID, alice.address, longCID)
      ).to.not.be.reverted;

      const pointer = await didRegistry.getDocPointer(testDID);
      expect(pointer).to.equal(longCID);
    });

    it("Should handle special characters in document pointer", async function () {
      const specialPointer = "https://example.com/did?id=123&type=json#fragment";
      await expect(
        didRegistry.registerDID(testDID, alice.address, specialPointer)
      ).to.not.be.reverted;

      const pointer = await didRegistry.getDocPointer(testDID);
      expect(pointer).to.equal(specialPointer);
    });

    it("Should handle controller being the same as caller on registration", async function () {
      await expect(
        didRegistry.connect(alice).registerDID(testDID, alice.address, testDocPointer)
      ).to.not.be.reverted;

      const controller = await didRegistry.getController(testDID);
      expect(controller).to.equal(alice.address);
    });

    it("Should allow different address to register DID on behalf of controller", async function () {
      // Owner registers DID for Alice
      await expect(
        didRegistry.connect(owner).registerDID(testDID, alice.address, testDocPointer)
      ).to.not.be.reverted;

      const controller = await didRegistry.getController(testDID);
      expect(controller).to.equal(alice.address);
    });
  });

  describe("Event Emission", function () {
    it("Should emit DIDRegistered event with correct parameters", async function () {
      const tx = await didRegistry.registerDID(
        testDID,
        alice.address,
        testDocPointer
      );
      await expect(tx)
        .to.emit(didRegistry, "DIDRegistered")
        .withArgs(testDID, alice.address, testDocPointer);
    });

    it("Should emit ControllerChanged event with correct parameters", async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
      
      const tx = await didRegistry
        .connect(alice)
        .updateController(testDID, bob.address);
      await expect(tx)
        .to.emit(didRegistry, "ControllerChanged")
        .withArgs(testDID, alice.address, bob.address);
    });

    it("Should emit DIDDocUpdated event with correct parameters", async function () {
      await didRegistry.registerDID(testDID, alice.address, testDocPointer);
      
      const tx = await didRegistry
        .connect(alice)
        .updateDocPointer(testDID, updatedDocPointer);
      await expect(tx)
        .to.emit(didRegistry, "DIDDocUpdated")
        .withArgs(testDID, updatedDocPointer);
    });
  });
});
